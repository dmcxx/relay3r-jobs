const { Job } = require("../Job");
const ethers = require("ethers");

const contract = require("../../contracts/relayer/unitraderelay3r.js");
const DebugJob = true;
class UnitradeRelayerJob extends Job {
  constructor(account, provider) {
    super(
      "UnitradeRelayer",
      new ethers.Contract(contract.address, contract.abi, account),
      provider
    );
  }

  async getExecutableFiltered() {
    this.orderList = await this.contract.getExecutableOrdersList();
    //Now iterate and remove any that may not pass
    for(const order of this.orderList) {
      try {
        await this.contract.callStatic.workSolo(order)
        if(DebugJob) this.log.info(`${order} is executable`)
        //If it worked,we have a executable one,do nothing
      }catch(error){
        if(DebugJob) this.log.info(`${order} is not executable`)
        //This means the order fails at executing,so remove it from array
        this.orderList = this.orderList.filter(item => item !== order)
      }
    }
  }

  async isWorkable() {
    //Filter executable orders
    await this.getExecutableFiltered();
    //Workable if orderlist that is executable has more than 0 orders
    return this.orderList.length > 0;
  }

  async callWork(gas) {
    await this.getExecutableFiltered();
    if(this.orderList.length > 0 )  {
      this.log.info(`Executing orders ${this.orderList.toString()}`);
      if (this.orderList.length > 1)
        return await this.contract.workBatch(this.orderList, {
          gasPrice: gas,
        });
      else
        return await this.contract.workSolo(this.orderList[0], {
          gasPrice: gas,
        });
    }
  }
}

exports.UnitradeRelayerJob = UnitradeRelayerJob;
